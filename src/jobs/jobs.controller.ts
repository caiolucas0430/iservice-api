import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from 'src/roles/enums/role.enum';

interface AuthRequest extends Request {
  user: {
    id: string;
    roles: string[];
  };
}

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() createJobDto: CreateJobDto, @Req() req: AuthRequest) {
    return this.jobsService.create(createJobDto, req.user.id);
  }

  @Get('my-jobs')
  findMyJobs(@Req() req: AuthRequest) {
    return this.jobsService.findByClient(req.user.id);
  }

  @Get('radar')
  @Roles(RoleName.PROFESSIONAL)
  async findRadar(
    @Query('latitude') lat: string,
    @Query('longitude') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.jobsService.findNearbyJobs(
      parseFloat(lat),
      parseFloat(lng),
      radius,
    );
  }

  @Patch(':id/cancel')
  async cancelJob(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.jobsService.cancelJob(id, req.user.id);
  }

  @Patch(':id/accept')
  @Roles(RoleName.PROFESSIONAL)
  async acceptJob(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.jobsService.acceptJob(id, req.user.id);
  }
}
