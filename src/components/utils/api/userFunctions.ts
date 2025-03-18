import { apiConnection } from "./apiConnection"

export const signIn = async (user: string, password: string) => {
    try {
        const response = await apiConnection.post(`/user`, { personId: parseInt(user), password: password });
        console.log("API Response:", response); // Log full response
        return response.data; // Ensure returning response.data
    } catch (error) {
        console.error("API Error:", error);
        return false;
    }
};

export const getFuncionarios = async () => {
    try {

        const response = await (await apiConnection.get(`/user/all/`)).data
        console.log(response)
        return response
    } catch (error) {
        console.error(error)
        return false
    }
}
