import { v1 } from '@datadog/datadog-api-client'

export default interface IWidget {
    type: any;
    createWidget(widgetDefinition: any, width: number, height: number, position?: {x: number, y: number}): v1.Widget;
}