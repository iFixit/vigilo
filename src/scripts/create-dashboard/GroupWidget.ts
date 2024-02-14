import { v1 } from "@datadog/datadog-api-client";
import IWidget from "./IWidget.js";
import { GroupWidgetDefinition } from "./widgetTypes.js";
import { WidgetTextAlign } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/index.js";

export default class GroupWidget implements IWidget {
    // Default values
    titleSize = "32";
    titleAlign: WidgetTextAlign = "left";
    type: v1.GroupWidgetDefinitionType = "group";

    createWidget(widgetDefinition: GroupWidgetDefinition): v1.Widget {
        return {
            definition: {
                title: "",
                titleSize: this.titleSize,
                titleAlign: this.titleAlign,
                type: this.type,
                layoutType: "ordered",
                ...widgetDefinition
            }
        }
    }

    addWidgetToGroup(widget: v1.Widget, group: v1.Widget): v1.Widget {
        const groupDefinition = group.definition as GroupWidgetDefinition;

        if (groupDefinition.type !== "group") {
            throw new Error('Invalid group widget');
        }

        groupDefinition.widgets = groupDefinition.widgets || [];
        groupDefinition.widgets.push(widget);

        return group;
    }
}