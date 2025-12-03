import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`Attempting login for ${email}`);
    try {
        const user = await this.prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          console.log('User not found');
          throw new UnauthorizedException('User not found');
        }

        // If user has no password set (legacy/oauth users), deny password login
        if (!user.password) {
            console.log('User has no password');
            throw new UnauthorizedException('Password not set for this user');
        }

        console.log('Comparing password...');
        const isMatch = await bcrypt.compare(pass, user.password);
        console.log(`Password match: ${isMatch}`);
        
        if (isMatch) {
          const { password, ...result } = user;
          return result;
        }
        
        throw new UnauthorizedException('Invalid credentials');
    } catch (error) {
        console.error('AuthService error:', error);
        throw error;
    }
  }
}
