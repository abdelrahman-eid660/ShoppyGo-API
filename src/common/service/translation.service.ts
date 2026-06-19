import { Injectable } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import { ITranslation } from "../interface";
@Injectable()
export class TranslationService {
  constructor( private readonly i18n: I18nService) {}
  translate({key ,lang , args} : ITranslation) {
    return this.i18n.translate(key, {
      lang,
      args,
    });
  }
}