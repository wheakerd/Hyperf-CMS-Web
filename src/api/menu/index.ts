import request from '@/axios'

export const getMenuListApi = () => {
    return request.get({ url: 'http://127.0.0.1:9500/admin/permission/menu/list' })
}

export const saveMenuListApi = (data: Record<string, any>) => {
    return request.post({
        url: 'http://127.0.0.1:9500/admin/permission/menu/save',
        data
    })
}
