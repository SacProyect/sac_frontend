import axios from "axios"

const apiURL = "http://localhost:8000/usuario"

export const signIn = async (user, password) => {
    try {
        const response = await (await axios.post(`${apiURL}`, { cedula: user, password: password })).data
        return response
    } catch (error) {
        console.error(error)
        return false
    }
}

export const getFuncionarios = async () => {
    try {

        const response = await (await axios.get(`${apiURL}/all`)).data
        console.log(response)
        return response
    } catch (error) {
        console.error(error)
        return false
    }
}
