"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract profile fields from request body
        const { email, password, name, bio, mobilenumber, address, rate } = req.body;
        // Check if user exists
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        // Create user and profile in transaction
        const [user, profile] = yield prisma.$transaction([
            prisma.user.create({
                data: {
                    email,
                    password: hashedPassword
                }
            }),
            prisma.profile.create({
                data: {
                    name,
                    email, // Links to user email
                    bio,
                    mobilenumber,
                    address,
                    rate: Number(rate)
                }
            })
        ]);
        // Create JWT
        const token = jsonwebtoken_1.default.sign({ email: user.email, id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res
            .cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        })
            .status(201)
            .json({ user, profile });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isPasswordCorrect = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ email: user.email, id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res
            .cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        })
            .status(200)
            .json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});
exports.login = login;
