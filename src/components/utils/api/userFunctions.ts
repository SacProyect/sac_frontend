import axios from "axios";
import { apiConnection } from "./apiConnection"

export const signIn = async (user: string, password: string) => {
    try {

        const response = await apiConnection.post(`/user`, { personId: parseInt(user), password: password });
        // console.log("API Response:", response); // Log full response
        return response.data; // Ensure returning response.data
    } catch (error: any) {

        // console.error("API Error:", error);

        // Handle specific axios errors
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // Backend responded with an error
                throw new Error(error.response.data.message || "Invalid credentials.");
            } else if (error.request) {
                // No response received from the server
                throw new Error("No response from server. Check your internet connection.");
            }
        }

        throw new Error("Something went wrong. Please try again later.");
    }
};

export const getOfficers = async () => {
    try {

        const res = await apiConnection.get(`/user/all/`);
        const payload = res?.data;

        // Backend may return either an array directly or wrapped in an object.
        // Normalize to always return an array to avoid "map is not a function".
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.users)) return payload.users;

        return [];
    } catch (error) {
        console.error(error)
        return []
    }
}
