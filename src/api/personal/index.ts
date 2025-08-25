import request from '@/axios'

export const getUserinfoApi = () => {
    return request.get({ url: 'http://127.0.0.1:9500/admin/index/userinfo' })
}

export const saveProfileApi = (data: Record<string, any>) => {
    return request.post({
        url: 'http://127.0.0.1:9500/admin/index/changeProfile',
        data: data
    })
}
