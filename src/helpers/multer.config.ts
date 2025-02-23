import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Request } from 'express';
import { UserSafe } from 'src/users/entities/user.schema';

export const multerOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const year = new Date().getFullYear().toString();
      const month = (new Date().getMonth() + 1).toString();
      const day = new Date().getDate().toString();
      const uploadPath = path.join(
        __dirname,
        '..',
        '..',
        'static',
        'uploads',
        file.fieldname,
        year,
        month,
        day,
      );

      // Check if the folder exists, if not, create it recursively
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      return cb(null, uploadPath);
    },

    filename: (
      req: Request & {
        user: UserSafe;
      },
      file,
      cb,
    ) => {
      const user = req.user;
      if (file.fieldname === 'avatar') {
        return cb(null, user._id + path.extname(file.originalname));
      }

      const filename = Date.now().toString() + path.extname(file.originalname);
      return cb(null, filename);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 0.5,
  },
};
