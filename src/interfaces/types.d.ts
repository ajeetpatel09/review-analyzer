export interface CustomResponse {
    data: unknown;
    error: unknown;
    message: string;
  }
  
  export interface JwtPayload {
    id: number;
    isAdmin: boolean;
    collegeId?: number;
  }
  
  export type RequestContext = {
    auth?: JwtPayload;
    tenantCollegeId?: number;
  };
  