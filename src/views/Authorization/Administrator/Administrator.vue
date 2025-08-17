<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { ref, unref, nextTick, watch, reactive } from 'vue'
import { ElTag, ElTree } from 'element-plus'
import {
    getDepartmentApi,
    saveUserApi,
    deleteUserByIdApi,
    getAdministratorTableApi
} from '@/api/department'
import type { DepartmentItem, DepartmentUserItem } from '@/api/department/types'
import { useTable } from '@/hooks/web/useTable'
import { Search } from '@/components/Search'
import Write from './components/Write.vue'
import Detail from './components/Detail.vue'
import { Dialog } from '@/components/Dialog'
import { getRoleListApi } from '@/api/role'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { BaseButton } from '@/components/Button'

const { t } = useI18n()

const { tableRegister, tableState, tableMethods } = useTable({
    fetchDataApi: async () => {
        const { pageSize, currentPage } = tableState
        const res = await getAdministratorTableApi({
            currentPage: unref(currentPage),
            perPage: unref(pageSize),
            ...unref(searchParams)
        })
        return {
            list: res.data.list || [],
            total: res.data.total || 0
        }
    },
    fetchDelApi: async () => {
        const res = await deleteUserByIdApi(unref(ids))
        return !!res
    }
})
const { total, loading, dataList, pageSize, currentPage } = tableState
const { getList, getElTableExpose, delList } = tableMethods

const crudSchemas = reactive<CrudSchema[]>([
    {
        field: 'selection',
        search: {
            hidden: true
        },
        form: {
            hidden: true
        },
        detail: {
            hidden: true
        },
        table: {
            type: 'selection'
        }
    },
    {
        field: 'id',
        label: '序号',
        form: {
            hidden: true
        },
        search: {
            hidden: true
        },
        detail: {
            hidden: true
        }
    },
    {
        field: 'nickname',
        label: '昵称'
    },
    {
        field: 'username',
        label: '用户名'
    },
    {
        field: 'role.name',
        label: '角色名称',
        search: {
            hidden: true
        },
        form: {
            component: 'Select',
            value: [],
            componentProps: {
                multiple: true,
                collapseTags: true,
                maxCollapseTags: 1
            },
            optionApi: async () => {
                const res = await getRoleListApi()
                return res.data?.list?.map((v: any) => ({
                    label: v.roleName,
                    value: v.id
                }))
            }
        }
    },
    {
        field: 'role.isSystem',
        label: '系统权限',
        table: {
            width: 240,
            slots: {
                default: (data: any) => {
                    const isSystem: boolean = data.row.role.isSystem
                    return (
                        <>
                            {isSystem ? (
                                <ElTag type="success" onClick={() => action(data.row, 'edit')}>
                                    是
                                </ElTag>
                            ) : (
                                <ElTag type="info" onClick={() => action(data.row, 'edit')}>
                                    否
                                </ElTag>
                            )}
                        </>
                    )
                }
            }
        }
    },
    {
        field: 'createTime',
        label: t('userDemo.createTime'),
        form: {
            component: 'Input'
        },
        search: {
            hidden: true
        }
    },
    {
        field: 'action',
        label: t('userDemo.action'),
        form: {
            hidden: true
        },
        detail: {
            hidden: true
        },
        search: {
            hidden: true
        },
        table: {
            width: 240,
            slots: {
                default: (data: any) => {
                    const row = data.row as DepartmentUserItem
                    return (
                        <>
                            <BaseButton type="primary" onClick={() => action(row, 'edit')}>
                                {t('exampleDemo.edit')}
                            </BaseButton>
                            <BaseButton type="success" onClick={() => action(row, 'detail')}>
                                {t('exampleDemo.detail')}
                            </BaseButton>
                            <BaseButton type="danger" onClick={() => delData(row)}>
                                {t('exampleDemo.del')}
                            </BaseButton>
                        </>
                    )
                }
            }
        }
    }
])

const { allSchemas } = useCrudSchemas(crudSchemas)

const searchParams = ref({})
const setSearchParams = (params: any) => {
    currentPage.value = 1
    searchParams.value = params
    getList()
}

const treeEl = ref<typeof ElTree>()

const currentNodeKey = ref('')
const departmentList = ref<DepartmentItem[]>([])
const fetchDepartment = async () => {
    const res = await getDepartmentApi()
    departmentList.value = res.data.list
    currentNodeKey.value =
        (res.data.list[0] && res.data.list[0]?.children && res.data.list[0].children[0].id) || ''
    await nextTick()
    unref(treeEl)?.setCurrentKey(currentNodeKey.value)
}
fetchDepartment()

const currentDepartment = ref('')
watch(
    () => currentDepartment.value,
    (val) => {
        unref(treeEl)!.filter(val)
    }
)

const dialogVisible = ref(false)
const dialogTitle = ref('')

const currentRow = ref<DepartmentUserItem>()
const actionType = ref('')

const AddAction = () => {
    dialogTitle.value = t('exampleDemo.add')
    currentRow.value = undefined
    dialogVisible.value = true
    actionType.value = ''
}

const delLoading = ref(false)
const ids = ref<string[]>([])

const delData = async (row?: DepartmentUserItem) => {
    const elTableExpose = await getElTableExpose()
    ids.value = row
        ? [row.id]
        : elTableExpose?.getSelectionRows().map((v: DepartmentUserItem) => v.id) || []
    delLoading.value = true

    await delList(unref(ids).length).finally(() => {
        delLoading.value = false
    })
}

const action = (row: DepartmentUserItem, type: string) => {
    dialogTitle.value = t(type === 'edit' ? 'exampleDemo.edit' : 'exampleDemo.detail')
    actionType.value = type
    currentRow.value = { ...row, department: unref(treeEl)?.getCurrentNode() || {} }
    dialogVisible.value = true
}

const writeRef = ref<ComponentRef<typeof Write>>()

const saveLoading = ref(false)

const save = async () => {
    const write = unref(writeRef)
    const formData = await write?.submit()
    if (formData) {
        saveLoading.value = true
        try {
            const res = await saveUserApi(formData)
            if (res) {
                currentPage.value = 1
                getList()
            }
        } catch (error) {
            console.log(error)
        } finally {
            saveLoading.value = false
            dialogVisible.value = false
        }
    }
}
</script>

<template>
    <div class="flex w-100% h-100%">
        <ContentWrap class="flex-[3] ml-20px">
            <Search
                :schema="allSchemas.searchSchema"
                @reset="setSearchParams"
                @search="setSearchParams"
            />

            <div class="mb-10px">
                <BaseButton type="primary" @click="AddAction">{{
                    t('exampleDemo.add')
                }}</BaseButton>
                <BaseButton :loading="delLoading" type="danger" @click="delData()">
                    {{ t('exampleDemo.del') }}
                </BaseButton>
            </div>
            <Table
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :columns="allSchemas.tableColumns"
                :data="dataList"
                :loading="loading"
                @register="tableRegister"
                :pagination="{
                    total
                }"
            />
        </ContentWrap>

        <Dialog v-model="dialogVisible" :title="dialogTitle">
            <Write
                v-if="actionType !== 'detail'"
                ref="writeRef"
                :form-schema="allSchemas.formSchema"
                :current-row="currentRow"
            />

            <Detail
                v-if="actionType === 'detail'"
                :detail-schema="allSchemas.detailSchema"
                :current-row="currentRow"
            />

            <template #footer>
                <BaseButton
                    v-if="actionType !== 'detail'"
                    type="primary"
                    :loading="saveLoading"
                    @click="save"
                >
                    {{ t('exampleDemo.save') }}
                </BaseButton>
                <BaseButton @click="dialogVisible = false">{{ t('dialogDemo.close') }}</BaseButton>
            </template>
        </Dialog>
    </div>
</template>
