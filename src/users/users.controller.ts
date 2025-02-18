import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    return this.usersService.findById(id);
  }
}
