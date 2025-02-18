import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRoles } from 'src/auth/entities/roles.enum';
import { User } from 'src/common/decorators/user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Auth(UserRoles.ADMIN)
  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @User('_id') userId: string,
  ) {
    return await this.postsService.create(createPostDto, userId);
  }

  @Get()
  async findAll() {
    return await this.postsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.postsService.findOne(id);
  }

  @Auth(UserRoles.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @User('_id') userId: string,
  ) {
    return await this.postsService.update(id, updatePostDto, userId);
  }

  @Auth(UserRoles.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @User('_id') userId: string) {
    return await this.postsService.remove(id, userId);
  }

  @Auth()
  @Get('like/:id')
  async likePost(@Param('id') id: string, @User('_id') userId: string) {
    return await this.postsService.likePostToggle(id, userId);
  }

  @Auth()
  @Get('toggleStatus/:id')
  async postStatusToggle(@Param('id') id: string, @User('_id') userId: string) {
    return await this.postsService.postStatusToggle(id, userId);
  }

  @Auth()
  @Get('bookmark/:id')
  async bookmarkPost(@Param('id') id: string, @User('_id') userId: string) {
    return await this.postsService.bookmarkPost(id, userId);
  }

  @Get('/author/:id')
  async findAuthorPosts(@Param('id') authorId: string) {
    return await this.postsService.findAuthorPosts(authorId);
  }
}
