import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    return next.handle().pipe(
      tap(() => {
        if (mutating && user) {
          // Audit logging is handled in individual services for fine-grained control.
          // This interceptor is a placeholder for cross-cutting concerns.
        }
      }),
    );
  }
}
