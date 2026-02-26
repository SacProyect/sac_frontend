import type { User } from "./user"

/** Backend puede devolver grupo con coordinator solo como { name } en algunos endpoints. */
export type Group = {
    id: string;
    name: string;
    coordinatorId?: string;
    coordinator?: User | { name?: string };
    members?: User[];
}