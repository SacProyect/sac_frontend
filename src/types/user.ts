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
}

export interface CoordinatedGroup {
    id: string,
}


