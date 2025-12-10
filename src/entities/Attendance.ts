import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  @Column({ type: "varchar", length: 10 })
  type!: "IN" | "OUT"; // Mark attendance as IN or OUT

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp!: Date;

  @Column({ nullable: true })
  imageUrl!: string | null; // URL of the uploaded/snapshot image

  @Column({ default: false })
  faceVerified!: boolean; // Whether face recognition was successful

  @Column({ type: "text", nullable: true })
  faceRecognitionData!: string | null; // Store face descriptor or recognition result
}

