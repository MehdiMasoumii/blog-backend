import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRoles } from 'src/auth/entities/roles.enum';
import { User } from 'src/common/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/helpers/multer.config';

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

  @Auth()
  @Get('author')
  async findAuthorPosts(@User('_id') userId: string) {
    return await this.postsService.findAuthorPosts(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    const post = await this.postsService.findOne(id);
    return post;
  }

  @Auth(UserRoles.ADMIN)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('coverImage', {
      storage: multerOptions.storage,
      fileFilter(req, file, cb) {
        const filetypes: string[] = ['image/jpeg', 'image/jpg', 'image/png'];
        if (filetypes.includes(file.mimetype)) {
          return cb(null, true);
        }
        return cb(new BadRequestException('File type not allowed'), false);
      },
      limits: {
        fileSize: 1024 * 1024 * 2,
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() coverImage: Express.Multer.File,
    @Body() updatePostDto: UpdatePostDto,
    @User('_id') userId: string,
  ) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    const coverImagePath = coverImage.path.split('uploads')[1];

    return await this.postsService.update(
      id,
      updatePostDto,
      userId,
      coverImagePath,
    );
  }

  @Auth(UserRoles.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @User('_id') userId: string) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    return await this.postsService.remove(id, userId);
  }

  @Auth()
  @Get('like/:id')
  async likePost(@Param('id') id: string, @User('_id') userId: string) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    return await this.postsService.likePostToggle(id, userId);
  }

  @Auth()
  @Get('toggleStatus/:id')
  async postStatusToggle(@Param('id') id: string, @User('_id') userId: string) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    return await this.postsService.postStatusToggle(id, userId);
  }

  @Auth()
  @Get('bookmark/:id')
  async bookmarkPost(@Param('id') id: string, @User('_id') userId: string) {
    if (id === ':id') {
      throw new BadRequestException();
    }
    return await this.postsService.bookmarkPost(id, userId);
  }
}
