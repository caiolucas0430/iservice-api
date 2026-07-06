import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import type { Point } from 'geojson';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true, unique: true })
  document: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  roleTitle: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  highlights: any;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: Point;
}
