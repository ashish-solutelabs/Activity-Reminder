import { Repository, EntityRepository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { BadRequestException} from '@nestjs/common';
import { User } from './user.entity';
import { SigninCredentialsDto } from './dto/signin-credentials.dto';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    
    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
        const { username, password } = authCredentialsDto;
        const user = new User();
        user.username = username;
        user.phoneNummber=authCredentialsDto.phonenumber
        user.email=authCredentialsDto.email
        user.salt = await bcrypt.genSalt();
        user.password = await this.hashPassword(password, user.salt);

        const userinfo =await user.save()
        if(!userinfo)
        {
            throw new BadRequestException("user is not ragister")
        }
        return userinfo
    }

    async validateUserPassword(signinCredentialsDto: SigninCredentialsDto): Promise<string> {
        const { username, password } = signinCredentialsDto;
        const user = await this.findOne({ username });

        if (user && await user.validatePassword(password)) {
            return user.username;
        } else {
            return null;
        }
    }

    private async hashPassword(password: string, salt: string): Promise<string> {
        return bcrypt.hash(password, salt);
    }
}
