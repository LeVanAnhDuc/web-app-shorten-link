import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateLinkDto, LinkResponseDto } from './dto';
import { LinksService } from './links.service';

@Controller('api/links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLinkDto): Promise<LinkResponseDto> {
    return this.linksService.create(dto.url);
  }
}
