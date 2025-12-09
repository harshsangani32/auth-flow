import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ nullable: true })
  otp!: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiry!: Date | null;

  @Column({ nullable: true })
  profilePhotoUrl!: string | null;
}
