import { CustomErrorException } from '@devseeder/microservices-exceptions';
import { AbstractService } from '@devseeder/nestjs-microservices-commons';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export abstract class HttpClientService extends AbstractService {
  protected headersRequest: any;

  constructor(
    protected readonly url: string,
    protected readonly httpService: HttpService,
  ) {
    super();
  }

  protected getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async post(endpoint: string, data: any): Promise<any> {
    try {
      this.logger.log(`Calling URL... ${this.url}${endpoint}`);
      this.logger.log(JSON.stringify(data));

      const response = await firstValueFrom(
        await this.httpService.post(
          `${this.url}${endpoint}`,
          JSON.stringify(data),
          {
            headers: this.getHeaders(),
          },
        ),
      );
      this.validateResponseStatus(response.data, response.status);
      return response;
    } catch (err) {
      this.logger.error(err.response.data);
      throw new CustomErrorException(
        err.response.data.message,
        err.response.data.status,
        err.response.data.errorCode,
      );
    }
  }

  protected validateResponseStatus(data: any, status: HttpStatus): boolean {
    switch (status) {
      case HttpStatus.ACCEPTED:
      case HttpStatus.CREATED:
      case HttpStatus.OK:
      case HttpStatus.NO_CONTENT:
      case HttpStatus.OK:
        return true;

      default:
        throw new HttpException(data, status);
    }
  }
}
