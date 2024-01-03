import { DTO } from '@devseeder/nestjs-microservices-commons';

export class UserBodyDto extends DTO {
  name: string;
  username: string;
  password: string;
  idUserAuth?: string;
}

export class UpdateUserDTO extends DTO {
  name: string;
}
