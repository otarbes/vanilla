/**
 * @copyright 2009-2018 Vanilla Forums Inc.
 * @license https://opensource.org/licenses/GPL-2.0 GPL-2.0
 */

import * as React from "react";
import { t } from "@dashboard/application";
import { log, logError } from "@dashboard/utility";
import DocumentTitle from "@dashboard/components/DocumentTitle";
import apiv2 from "@dashboard/apiv2";
import LinkUserFail from "@dashboard/app/authenticate/components/LinkUserFail";
import LinkUserRegister from "@dashboard/app/authenticate/components/LinkUserRegister";
import { IRequiredComponentID, uniqueIDFromPrefix } from "@dashboard/componentIDs";
import classNames from "classnames";
import { getMeta } from "@dashboard/application";
import gdn from "@dashboard/gdn";
import SsoUser from "@dashboard/app/authenticate/components/ssoUser";
import { authenticatorsSet } from "@dashboard/app/state/actions/authenticateActions";
import Paragraph from "@dashboard/components/forms/Paragraph";
import InputTextBlock from "@dashboard/components/forms/InputTextBlock";
import get from "lodash/get";

interface IProps {}

interface IState {
    step: string;
    linkUser: any;
    error?: string;
    authSessionID: string;
}

export default class ConnectPage extends React.Component<IProps, IState> {
    public static defaultProps = {};

    constructor(props) {
        super(props);
        const metaState = gdn.getMeta("state") || {};
        const authenticate = metaState.authenticate || {};
        this.setErrorState = this.setErrorState.bind(this);

        this.state = {
            ...authenticate,
            step: authenticate.step || "fail",
            authSessionID: authenticate.authSessionID,
        };
    }

    public setErrorState(e) {
        this.setState({
            step: "error",
            error: get(e, "message", t("An error has occurred, please try again.")),
        });
    }

    public render() {
        const stepClasses = classNames("authenticateConnect", "authenticateConnect-" + this.state.step);

        const linkUser = get(this, "state.linkUser", {});

        let pageTitle;
        const content: JSX.Element[] = [];

        log(t("Rendering Connect Page: "));

        switch (this.state.step) {
            case "linkUser":
                pageTitle = t("Your %s Account").replace("%s", linkUser.authenticator.name);

                content.push(
                    <SsoUser
                        key={uniqueIDFromPrefix("ConnectPage-SSOUser")}
                        ssoUser={linkUser.ssoUser}
                        ui={linkUser.authenticator.ui}
                    />,
                );

                content.push(
                    <LinkUserRegister
                        key={uniqueIDFromPrefix("ConnectPage-linkUserRegister")}
                        setErrorState={this.setErrorState}
                        config={linkUser.config}
                        ssoUser={linkUser.ssoUser}
                        termsOfServiceLabel={linkUser.authenticator.ui.termsOfServiceLabel}
                        authSessionID={this.state.authSessionID}
                    />,
                );

                break;
            //     case "password":
            //         content += ssoUser;
            //         content += <LinkUserPassword {...this.state.authenticate} />;
            //         break;
            //     case "error":
            //         // Handle errors
            //         content = "Do Error";
            //     // break;
            default:
                // Fail, unable to recover
                pageTitle = t("Error Signing In");
                content.push(
                    <LinkUserFail
                        key={uniqueIDFromPrefix("ConnectPage-linkUserFail")}
                        message={get(this, "state.error", null)}
                    />,
                );
        }

        log(t("ConnectPage.state: "), this.state);

        return (
            <div className="authenticateConnect">
                <DocumentTitle title={pageTitle}>
                    <h1 className="isCentered">{pageTitle}</h1>
                </DocumentTitle>
                <div className="authenticateUserCol">
                    <div className={stepClasses}>{content}</div>
                </div>
            </div>
        );
    }
}
