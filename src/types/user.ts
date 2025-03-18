<<<<<<< HEAD
import { Group } from "./group"
=======
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
import { Taxpayer } from "./taxpayer"



export interface User {
    id: string,
    name: string,
    role: string,
    personId: string,
    password: string,
    status: boolean,
    taxpayer: Taxpayer[],
<<<<<<< HEAD
    coordinatedGroup: CoordinatedGroup,
    group: Group,
    groupId: string,
    supervisorId?: string,
    supervised_members?: User[],
    supervisor?: User,
}

export interface CoordinatedGroup {
    id: string,
    name: string,
    coordinatorId: string,
    coordinator: User,
    members: User[],
}


=======
}



>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
