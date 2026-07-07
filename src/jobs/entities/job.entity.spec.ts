import { Job, JobStatus } from './job.entity';
import { User } from '../../users/entities/user.entity';

describe('Job Entity', () => {
  it('should be defined and instantiate correctly', () => {
    const job = new Job();
    const userClient = new User();
    const userProfessional = new User();

    expect(job).toBeDefined();

    job.description = 'Test job';
    job.status = JobStatus.SEARCHING;
    job.client = userClient;
    job.professional = userProfessional;

    expect(job.description).toBe('Test job');
    expect(job.status).toBe(JobStatus.SEARCHING);
    expect(job.client).toBe(userClient);
    expect(job.professional).toBe(userProfessional);
  });
});
