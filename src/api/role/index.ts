import request from '@/axios'

export const getRoleListApi = () => {
    return request.get({ url: 'http://127.0.0.1:9500/admin/permission/role/table' })
}
