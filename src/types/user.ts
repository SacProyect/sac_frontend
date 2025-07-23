import { Group } from "./group"
import { Taxpayer } from "./taxpayer"



export interface User {
    id: string,
    name: string,
    role: string,
    personId: string,
    password: string,
    status: boolean,
    taxpayer: Taxpayer[],
    coordinatedGroup: CoordinatedGroup,
    group: Group,
    groupId: string,
    supervisorId?: string,
    supervised_members?: User[],
}

export interface CoordinatedGroup {
    id: string,
    name: string,
    coordinatorId: string,
    coordinator: User,
    members: User[],
}


