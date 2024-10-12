import axios from "axios"

const apiURL = "http://localhost:8000"

export const signIn = async (user, password) => {
    try {
        const response = await (await axios.post(`${apiURL}/usuario`, { cedula: user, password: password })).data
        return response
    } catch (error) {
        console.error(error)
        return false
    }
}