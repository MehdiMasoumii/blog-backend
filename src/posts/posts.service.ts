import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Types } from 'mongoose';
import { Post } from './entities/post.schema';
import { UserSafe } from 'src/users/entities/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    private readonly userService: UsersService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    try {
      const newPost = await this.postModel.create({
        ...createPostDto,
        author: new Types.ObjectId(authorId),
      });
      await newPost.populate('author', '-__v -password');
      return newPost;
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid Author id!',
          });
        }
      }
    }
  }

  async findAll() {
    try {
      return await this.postModel.find({
        isPublished: true,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async findAuthorPosts(authorId: string) {
    try {
      const posts = await this.postModel.find({
        author: authorId,
      });
      return posts;
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Author not found!',
          });
        }
      }
    }
  }

  async findOne(id: string) {
    try {
      const post = await this.postModel
        .findById(id)
        .populate<{ author: UserSafe }>('author', '-password -__v')
        .exec();

      if (!post) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Post not found!',
        });
      }
      return post;
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new NotFoundException({
            statusCode: 404,
            message: 'Post not found!',
          });
        }
      }
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }

  async findOneByIdAndAuthor(_id: string, authorId: string) {
    try {
      const post = await this.postModel.findOne({
        _id,
        author: authorId,
      });
      if (!post) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Post not found!',
        });
      }
      return post;
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Post not found!',
          });
        }
      }
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
    coverImagePath?: string,
  ) {
    const post = await this.findOneByIdAndAuthor(id, userId);

    Object.assign(post, {
      lastModifiedDate: new Date(),
      coverImage: coverImagePath || post.coverImage,
      ...updatePostDto,
    });
    try {
      return await post.save();
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }

  async remove(_id: string, userId: string) {
    let post: Post | null;
    try {
      post = await this.postModel.findOneAndDelete({
        _id,
        author: userId,
      });
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Post not found!',
          });
        }
      }
      throw new InternalServerErrorException();
    }
    if (post) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Post has deleted',
      };
    }
    throw new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Post not found!',
    });
  }

  async postStatusToggle(id: string, userId: string) {
    const post = await this.findOneByIdAndAuthor(id, userId);
    post.isPublished = !post.isPublished;
    try {
      await post.save();
      return {
        statusCode: 201,
        message: post.isPublished ? 'Post has published' : 'Post has archived',
      };
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }

  async likePostToggle(id: string, userId: string) {
    try {
      const post = await this.findOne(id);
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found!',
        });
      }
      const userObjId = new Types.ObjectId(userId); //converts string userId to valid mongoose objectId type

      if (post.likes.includes(userObjId)) {
        // checks if post likes includes userId(this means user liked this post already), removes userId from likes(remove like)
        await this.postModel.findByIdAndUpdate(id, {
          $pull: { likes: userId },
        });
        await this.userService.toggleLike(id, userId, 'remove');
        return {
          statusCode: HttpStatus.OK,
          message: 'post like has removed',
        };
      } else {
        // if doesn't include(this means user doesn't like post), add userId to likes(likes post)
        await this.postModel.findByIdAndUpdate(id, {
          $addToSet: { likes: userId },
        });
        await this.userService.toggleLike(id, userId, 'add');
        return {
          statusCode: HttpStatus.OK,
          message: 'post has liked',
        };
      }
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Post not found!',
          });
        }
      }
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }

  async bookmarkPost(postId: string, userId: string) {
    try {
      const user = await this.userService.findById(userId);
      const postObjId = new Types.ObjectId(postId); //converts postId to valid mongoose objectId type
      if (user) {
        const bookmarksCount = user.bookmarkedPosts.length;

        // checks if user bookmarks includes postId(this means user bookmarked this post already),
        // removes postId from bookmarks(remove bookmark)
        // if doesn't include(this means user doesn't bookmark post), add postId to bookmarks(bookmarks post)
        user.bookmarkedPosts = user.bookmarkedPosts.includes(postObjId)
          ? user.bookmarkedPosts.filter((item) => item === postObjId)
          : [...user.bookmarkedPosts, postObjId];

        // save changes
        await user.save();
        return {
          statusCode: HttpStatus.OK,
          message:
            bookmarksCount < user.bookmarkedPosts.length
              ? 'post has bookmarked'
              : 'post bookmark has removed',
        };
      }
      // if user not found throws not found exception
      throw new NotFoundException({
        statusCode: 404,
        message: 'User not found!',
      });
    } catch (err) {
      if (err instanceof MongooseError) {
        if (err.name === 'CastError') {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Post not found!',
          });
        }
      }
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }
}
