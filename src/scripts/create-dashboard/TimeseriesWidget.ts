import { v1 } from "@datadog/datadog-api-client";
import IWidget from "./IWidget.js";
import { TimeseriesWidgetDefinition } from "./widgetTypes.js";
import { WidgetTextAlign } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/index.js";

export default class TimeseriesWidget implements IWidget {
    // Default values
    titleSize = "16";
    titleAlign: WidgetTextAlign = "left";
    type: v1.TimeseriesWidgetDefinitionType = "timeseries";

    createWidget(widgetDefinition: TimeseriesWidgetDefinition, width = 4, height = 2, position?: {x: number, y: number}): v1.Widget {
        return {
            definition: {
                title: "",
                titleSize: this.titleSize,
                titleAlign: this.titleAlign,
                type: this.type,
                showLegend: true,
                ...widgetDefinition
            },
            layout: {
                width: width,
                height: height,
                x: position?.x || 0,
                y: position?.y || 0
            }
        }
    }

    createAlertMaker(conditional: {
        min?: number,
        max?: number
        exact?: number
    }, severity?: 'error' | 'warning' | 'ok'| 'info', label?: string): v1.WidgetMarker {
        const {min, max, exact} = conditional;
        let value = '';

        if (exact) {
            value = `y = ${exact}`;
        } else if (min && max) {
            value = `${min} < y < ${max}`;
        } else if (min) {
            value = `y > ${min}`;
        } else if (max) {
            value = `y < ${max}`;
        } else {
            throw new Error('Invalid conditional');
        }

        return {
            displayType: severity,
            label: label,
            value: value,
        }
    }
}