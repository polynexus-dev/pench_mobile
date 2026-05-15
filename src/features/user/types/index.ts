    import type { User, UserRole } from "@/types/domain/user.types";

    export interface UserProfile extends User {
    phone?: string;
    joinDate?: string;
    }