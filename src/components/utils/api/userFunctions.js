import { apiConnection } from "./apiConnection"

export const signIn = async (user, password) => {
    try {
        const response = await (await apiConnection.post(`/usuario`, { cedula: user, password: password })).data
        return response
    } catch (error) {
        console.error(error)
        return false
    }
}

export const getFuncionarios = async () => {
    try {

        const response = await (await apiConnection.get(`/usuario/all`)).data
        console.log(response)
        return response
    } catch (error) {
        console.error(error)
        return false
    }
}
