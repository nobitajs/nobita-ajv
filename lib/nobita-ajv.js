const Ajv = require('ajv');

module.exports = app => {
  const ajv = new Ajv(app.config.ajv);
  
  return async (ctx, next) => {
    const method = ctx.method.toLocaleLowerCase();
    const responseStringify = ctx.app.responseSchema[`${method}_${ctx.URL.pathname}`] || ctx.app.responseSchema[`all_${ctx.URL.pathname}`];
    const schema = ctx.app.schema[`${method}_${ctx.URL.pathname}`] || ctx.app.schema[`all_${ctx.URL.pathname}`];
    let valid = true;
    let validate = {};
    if (schema && schema.query) {
      validate = ajv.compile(schema.query);
      valid = validate(ctx.query);
    }

    if (schema && schema.body) {
      validate = ajv.compile(schema.body);
      valid = validate(ctx.request.body);
    }

    if (schema && schema.headers) {
      validate = ajv.compile(schema.headers);
      valid = validate(ctx.headers);
    }

    if (!valid) {
      return ctx.body = {
        code: 400,
        error: 'Bad Request',
        message: ajv.errorsText(validate.errors),
        data: {
          url: ctx.request.url,
        }
      }
    }
    await next();
    if (responseStringify) {
      ctx.body = responseStringify(ctx.body);
    }

  }
};