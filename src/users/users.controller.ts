import {
  Controller,
  Patch,
  UseGuards,
  Body,
  Req,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';
import type { IFile } from '../common/interfaces/file.interface';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch('me/role')
  @UseGuards(JwtAuthGuard)
  async switchRole(
    @Req() req: RequestWithUser,
    @Body() switchRoleDto: SwitchRoleDto,
  ) {
    return this.usersService.switchRole(req.user.id, switchRoleDto.role);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    return this.usersService.findMe(req.user.id);
  }

  @Get('professionals/:id/portfolio')
  async getPortfolio(@Param('id') id: string) {
    return this.usersService.getPortfolio(id);
  }

  @Patch('me/portfolio')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  async updatePortfolio(
    @Req() req: RequestWithUser,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @UploadedFiles() files: { avatar?: IFile[]; cover?: IFile[] },
  ) {
    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.cover?.[0];

    return this.usersService.updatePortfolio(
      req.user.id,
      updatePortfolioDto,
      avatarFile,
      coverFile,
    );
  }

  @Post('me/portfolio/items')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async addPortfolioItem(
    @Req() req: RequestWithUser,
    @Body() createPortfolioItemDto: CreatePortfolioItemDto,
    @UploadedFile() image: IFile,
  ) {
    return this.usersService.addPortfolioItem(
      req.user.id,
      createPortfolioItemDto,
      image,
    );
  }

  @Post('me/certificates')
  @UseGuards(JwtAuthGuard)
  async addCertificate(
    @Req() req: RequestWithUser,
    @Body() createCertificateDto: CreateCertificateDto,
  ) {
    return this.usersService.addCertificate(req.user.id, createCertificateDto);
  }
}
