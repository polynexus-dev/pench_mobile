    import type { User, UserRole } from "@/types/domain/user.types";

    export interface UserProfile extends Omit<User, "phone"> {
    phone?: string;
    joinDate?: string;
    }