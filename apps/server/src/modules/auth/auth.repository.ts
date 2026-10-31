import { db } from '../../db/client.js';
import { users, students, tutors, User } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { UserRole, VerificationStatus } from '@tutorpair/shared';

export interface UserWithProfileStatus extends User {
  profile_completed: boolean;
  verification_status?: VerificationStatus | null;
}

export const authRepository = {
  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.cognito_sub, cognitoSub))
      .limit(1);

    return user ?? null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  },

  async createUser(data: {
    cognito_sub: string;
    email: string;
    role: UserRole;
  }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        cognito_sub: data.cognito_sub,
        email: data.email,
        role: data.role,
      })
      .returning();

    return newUser;
  },

  async findUserWithProfileStatus(id: string): Promise<UserWithProfileStatus | null> {
    const user = await this.findById(id);
    if (!user) return null;

    let profileCompleted = false;
    let verificationStatus: VerificationStatus | null = null;

    if (user.role === UserRole.STUDENT) {
      const [student] = await db
        .select({ id: students.user_id })
        .from(students)
        .where(eq(students.user_id, user.id))
        .limit(1);
      profileCompleted = !!student;
    } else if (user.role === UserRole.TUTOR) {
      const [tutor] = await db
        .select({
          id: tutors.user_id,
          verification_status: tutors.verification_status,
        })
        .from(tutors)
        .where(eq(tutors.user_id, user.id))
        .limit(1);

      profileCompleted = !!tutor;
      verificationStatus = (tutor?.verification_status as VerificationStatus) ?? null;
    } else if (user.role === UserRole.ADMIN) {
      profileCompleted = true;
    }

    return {
      ...user,
      profile_completed: profileCompleted,
      ...(verificationStatus ? { verification_status: verificationStatus } : {}),
    };
  },
};
