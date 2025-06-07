import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

interface GithubProfile {
  id: string;
  username: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const options = (() => {
      const pat = configService.get<string>('GITHUB_PAT');
      if (pat) {
        return {
          clientID: 'pat-auth',
          clientSecret: pat,
          callbackURL: 'pat-callback',
          scope: ['user:email'],
        };
      }

      const clientID = configService.get<string>('GITHUB_CLIENT_ID');
      const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
      const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

      if (!clientID || !clientSecret || !callbackURL) {
        throw new Error('Missing GitHub OAuth configuration');
      }

      return {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['user:email'],
      };
    })();

    super(options);
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: GithubProfile,
  ): Promise<{
    id: string;
    email: string;
    username: string;
    avatar: string;
    accessToken: string;
  }> {
    const { id, username, emails, photos } = profile;
    const user = {
      id,
      email: emails[0]?.value || '',
      username,
      avatar: photos[0]?.value || '',
      accessToken,
    };
    return Promise.resolve(user);
  }
}
