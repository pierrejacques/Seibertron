import Framework from '@/enum/preserved/framework.enum';
import ProgramingLanguage from '@/enum/preserved/programing-language.enum';
import PackageManager from '@/enum/preserved/package-manager.enum';
import RouteSchema from '@/interfaces/preserved/route.schema';
import DynamicObject from '@/interfaces/dynamic-object';

export interface DeploymentOption {
  origin: string;
  script: string;
}

export default interface ProjectSchema {
  // 编译用的框架名称
  framework: Framework;
  language: ProgramingLanguage;
  packageManager: PackageManager;
  routes: RouteSchema[];
  // 编译和部署用的 shell 脚本
  shell?: any;
  // 编译用的脚本
  scripts?: any;
  deployment: {
    test: DeploymentOption[];
    dev: DeploymentOption[];
    prod: DeploymentOption[];
  };
  // 埋点
  tracking: DynamicObject;
}
