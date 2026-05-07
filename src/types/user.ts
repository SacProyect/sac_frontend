import { Group } from "./group"
import { Taxpayer } from "./taxpayer"

/**
 * Usuario. Campos opcionales según endpoint (login devuelve coordinatedGroup.id; getAllUsers puede no incluir taxpayer/group).
 */
export interface User {
    id: string;
    name: string;
    /** Presente en algunos endpoints / perfil. */
    email?: string;
    role: string;
    personId: string;
    password?: string;
    status?: boolean;
    taxpayer?: Taxpayer[];
    /** Login/detalle: al menos { id }. Coordinador: puede incluir members. */
    coordinatedGroup?: CoordinatedGroup | { id: string };
    group?: Group;
    groupId?: string | null;
    supervisorId?: string | null;
    supervised_members?: User[];
    supervisor?: User;
}

export interface CoordinatedGroup {
    id: string;
    name?: string;
    coordinatorId?: string;
    coordinator?: User;
    members?: User[];
}


