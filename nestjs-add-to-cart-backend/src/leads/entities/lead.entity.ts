import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column('real')
  price: number;

  @Column()
  address: string;

  @Column()
  state: string;

  @Column()
  city: string;

  @Column()
  zip: string;

  @Column('date')
  dob: Date;

  @Column()
  ssn: string;

  @Column()
  email: string;

  @Column('int', { nullable: true })
  score?: number;

  @CreateDateColumn()
  createdAt: Date;
}

