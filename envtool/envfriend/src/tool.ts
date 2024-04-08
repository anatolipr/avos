
((window: any) => {

  const functions: any = {};
  let environmentsPath = './environments.json';
  functions.environmentsPath = environmentsPath;

  type Environment = {
    id: string,
    bucketPath?: string
  }

  type EnvironmentMap = {
    [k: string]: Environment;
  };

  type EnvironmentsFile = {
    configuration: {
      environments: Environment[];
    };
  };

  type attrsArray = [string, string][];
  type elDef = {
    el: string,
    target: string,
    attrs: attrsArray
  }

  let currentConfig: EnvironmentMap | undefined = undefined;

  (window as any).__envfriend = functions;

  functions.overrideCurrentEnvironment = function(override: string): void {
    
    const date = !!override
      ? 'Fri, 31 Dec 9999 23:59:59 GMT'
      : 'Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = `_imenvt_=${override}; expires=${date}; path=/`;

    console.log('Overrde applied', override)
  }

  functions.getCurrentEnvironmentString = function(): string {
    let override = document.cookie.match(
      new RegExp('(^| )_imenvt_=([^;]+)')
    )?.[2];
    return override || (window as any)._imenvt_ || 'production';
  }

  functions.getFilenameFromURL = function(url: string): string | '' {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename?.indexOf('.') > -1 ? filename : '';
  }

  /**
   * append element in DOM
   * @param vdomEls eg. [
      {
          "el": "script", "target": "body", "attrs": [["src", "...."]]
      }
  ]
  */
  functions.appendEl = function(vdomEls: elDef[]): void {
    vdomEls.forEach((elDef) => {
      const el = document.createElement(elDef.el);
      (elDef.attrs || []).forEach((attrDef) => {
        el.setAttribute(attrDef[0], attrDef[1]);
      });
      document.querySelector(elDef.target || 'head')!.appendChild(el);
    });
  }
  
  functions.getEnvironmentUrl = async function (template: string): Promise<string> {

    const env = functions.getCurrentEnvironmentString();

    if (env.match(/^https?:/i)) {
      return env + '/' + functions.getFilenameFromURL(template);
    }

    //cache
    if (currentConfig === undefined) {
      const conf: EnvironmentsFile = await fetch(environmentsPath).then(r => r.json());
      currentConfig = conf?.configuration?.environments
        .reduce((acc: EnvironmentMap, v: Environment) => {
          acc[v.id] = v;
          return acc;
        }, {}) || {};
    }

    if (currentConfig[env] !== undefined) {
      return template.replaceAll('{env}', currentConfig[env].bucketPath || currentConfig[env].id)
    } else {
      return template.replaceAll('{env}',
        currentConfig['production']?.bucketPath || currentConfig['production']?.id || 'production'
      )
    }

  }

})(globalThis)
