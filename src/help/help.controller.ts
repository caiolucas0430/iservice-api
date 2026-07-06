import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HelpService } from './help.service';

@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Public()
  @Get('faq')
  getFaq() {
    return this.helpService.getFaq();
  }
}
