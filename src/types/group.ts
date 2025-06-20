import { User } from "./user"


export type Group = {
    id: string,
    name: string,
    coordinatorId: string,
    coordinator: User,
    members: User[],
}