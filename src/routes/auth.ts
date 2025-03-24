import { Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, Profile } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const signup: RequestHandler = async (req, res) => {
  try {
    // Extract profile fields from request body
    const { email, password, name, bio, mobilenumber, address, rate, city } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in transaction
    const [user, profile] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          city
        }
      }),
      prisma.profile.create({
        data: {
          name,
          bio,
          mobilenumber,
          address,
          rate: Number(rate),
          userId: (await prisma.user.findUnique({ where: { email } }))!.id
        }
      })
    ]);

    // Create JWT
    const token = jwt.sign(
      { email: user.email, id: user.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res
      .cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      })
      .status(201)
      .json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { email: user.email, id: user.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res
      .cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 3600000
      })
      .status(200)
      .json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getUsersByCity: RequestHandler = async (req, res) => {
  try {
    const { city } = req.query;
    const users = await prisma.user.findMany({
      where: { city: city as string },
      select: {
        id: true,
        email: true,
        city: true,
        createdAt: true
      }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
}; 