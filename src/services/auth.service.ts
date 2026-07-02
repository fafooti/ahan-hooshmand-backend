import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';

interface AuthTokenPayload {
  sub: number;
  username: string;
}

export const authService = {
  async login(username: string, password: string) {
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new AppError(401, 'Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid username or password');
    }

    const payload: AuthTokenPayload = { sub: user.id, username: user.username };

    const signOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    };

    const token = jwt.sign(payload, config.jwtSecret, signOptions);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    };
  },
};
