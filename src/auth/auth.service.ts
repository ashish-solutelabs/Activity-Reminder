import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { SigninCredentialsDto } from './dto/signin-credentials.dto';

@Injectable()
export class AuthService {
    private logger = new Logger('AuthService');
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
        private jwtService: JwtService,
    ) {}

    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
        console.log(authCredentialsDto)
        const status = await this.userRepository.signUp(authCredentialsDto);
        if(status)
        {
            const signinToken = {
                username:authCredentialsDto.username,
                password:authCredentialsDto.password
            }
            return await this.signIn(signinToken)
        }
        

    }

    async signIn(signinCredentialsDto: SigninCredentialsDto): Promise<{ accessToken: string }> {
        const username = await this.userRepository.validateUserPassword(signinCredentialsDto);

        if (!username) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = { username };
        const accessToken = await this.jwtService.sign(payload);
        this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(payload)}`);

        return { accessToken };
    }
}
