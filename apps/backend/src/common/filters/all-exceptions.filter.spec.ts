import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  it('should format HttpException response', () => {
    const filter = new AllExceptionsFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({ url: '/api/test' }),
      }),
    };

    filter.catch(new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/api/test',
      }),
    );
  });

  it('should format unknown exception as internal server error', () => {
    const filter = new AllExceptionsFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host: any = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({ url: '/api/test' }),
      }),
    };

    filter.catch(new Error('Boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
    );
  });
});
