/*
 * @author Stéphane LaFlèche <stephane.l@vanillaforums.com>
 * @copyright 2009-2018 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

import * as React from "react";
import { components } from "react-select";
import AsyncCreatableSelect from "react-select/lib/AsyncCreatable";
import { getRequiredID, IOptionalComponentID } from "@library/componentIDs";
import classNames from "classnames";
import { t } from "@library/application";
import Button from "@library/components/forms/Button";
import Heading from "@library/components/Heading";
import { InputActionMeta } from "react-select/lib/types";
import * as selectOverrides from "./overwrites";
import ButtonLoader from "@library/components/ButtonLoader";
import { OptionProps } from "react-select/lib/components/Option";
import Translate from "@library/components/translation/Translate";
import { ClearButton } from "@library/components/forms/select/ClearButton";
import ConditionalWrap from "@library/components/ConditionalWrap";
import { search } from "@library/components/icons/header";

export interface IComboBoxOption<T = any> {
    value: string | number;
    label: string;
    data?: T;
}

interface IProps extends IOptionalComponentID {
    disabled?: boolean;
    className?: string;
    placeholder: string;
    options?: any[];
    loadOptions?: (inputValue: string) => Promise<any>;
    value: string;
    onChange: (value: string) => void;
    isBigInput?: boolean;
    noHeading: boolean;
    title: React.ReactNode;
    isLoading?: boolean;
    onSearch: () => void;
    optionComponent?: React.ComponentType<OptionProps<any>>;
    getRef?: any;
    buttonClassName?: string;
    hideSearchButton?: boolean;
}

interface IState {
    forceMenuClosed: boolean;
}

/**
 * Implements the search bar component
 */
export default class SearchBar extends React.Component<IProps, IState> {
    public static defaultProps: Partial<IProps> = {
        disabled: false,
        isBigInput: false,
        noHeading: false,
        title: t("Search"),
        isLoading: false,
        optionComponent: selectOverrides.SelectOption,
    };

    public state: IState = {
        forceMenuClosed: false,
    };
    private id: string;
    private prefix = "searchBar";
    private searchButtonID: string;
    private searchInputID: string;
    private ref = React.createRef<AsyncCreatableSelect<any>>();

    constructor(props: IProps) {
        super(props);
        this.id = getRequiredID(props, this.prefix);
        this.searchButtonID = this.id + "-searchButton";
        this.searchInputID = this.id + "-searchInput";
    }

    public render() {
        const { className, disabled, isLoading } = this.props;

        return (
            <AsyncCreatableSelect
                ref={this.ref}
                id={this.id}
                value={undefined}
                onChange={this.handleOptionChange}
                closeMenuOnSelect={false}
                inputId={this.searchInputID}
                inputValue={this.props.value}
                onInputChange={this.handleInputChange}
                components={this.componentOverwrites}
                isClearable={false}
                blurInputOnSelect={false}
                allowCreateWhileLoading={true}
                controlShouldRenderValue={false}
                isDisabled={disabled || isLoading}
                loadOptions={this.props.loadOptions}
                menuIsOpen={this.isMenuVisible}
                classNamePrefix={this.prefix}
                className={classNames(this.prefix, className)}
                placeholder={this.props.placeholder}
                aria-label={t("Search")}
                escapeClearsValue={true}
                pageSize={20}
                theme={this.getTheme}
                styles={this.customStyles}
                backspaceRemovesValue={true}
                createOptionPosition="first"
                formatCreateLabel={this.createFormatLabel}
            />
        );
    }

    /**
     * Determine if we should show the menu or not.
     *
     * - Menu can be forced closed through state.
     * - Having no value in the input keeps the search closed.
     * - Otherwise falls back to what is determined by react-select.
     */
    private get isMenuVisible(): boolean | undefined {
        return this.state.forceMenuClosed || this.props.value.length === 0 ? false : undefined;
    }

    /**
     * Handle changes in option.
     *
     * - Update the input value.
     * - Force the menu closed.
     * - Trigger a search.
     */
    private handleOptionChange = (option: IComboBoxOption) => {
        if (option) {
            this.props.onChange(option.label);
            this.setState({ forceMenuClosed: true }, () => {
                this.props.onSearch && this.props.onSearch();
            });
        }
    };

    /**
     * Create a label for React Select's "Add option" option.
     */
    private createFormatLabel = (inputValue: string) => {
        return <Translate source="Search for <0/>" c0={<strong>{inputValue}</strong>} />;
    };

    /**
     * Handle changes in the select's text input.
     *
     * Ignores change caused by blurring or closing the menu. These normally clear the input.
     */
    private handleInputChange = (value: string, reason: InputActionMeta) => {
        if (!["input-blur", "menu-close"].includes(reason.action)) {
            this.props.onChange(value);
            this.setState({ forceMenuClosed: false });
        }
    };

    /**
     * Unset some of the inline styles of react select.
     */
    private customStyles = {
        option: (provided: React.CSSProperties) => ({
            ...provided,
        }),
        menu: (provided: React.CSSProperties, state) => {
            return { ...provided, backgroundColor: undefined, boxShadow: undefined };
        },
        control: (provided: React.CSSProperties) => ({
            ...provided,
            borderWidth: 0,
        }),
    };

    /**
     * Unset many of react-selects theme values.
     */
    private getTheme = theme => {
        return {
            ...theme,
            borderRadius: {},
            colors: {},
            spacing: {},
        };
    };

    /**
     * Overwrite for the Control component in react select
     * @param props
     */
    private SearchControl = props => {
        return (
            <form className="searchBar-form" onSubmit={this.onFormSubmit}>
                {!this.props.noHeading && (
                    <Heading depth={1} className="searchBar-heading">
                        <label className="searchBar-label" htmlFor={this.searchInputID}>
                            {this.props.title}
                        </label>
                    </Heading>
                )}
                <div className="searchBar-content">
                    <div
                        className={classNames(
                            `${this.prefix}-valueContainer`,
                            "suggestedTextInput-inputText",
                            "inputText",
                            "isClearable",
                            {
                                isLarge: this.props.isBigInput,
                            },
                        )}
                    >
                        <components.Control {...props} />
                        {this.props.value && <ClearButton onClick={this.clear} />}
                    </div>
                    <ConditionalWrap condition={!!this.props.hideSearchButton} className="sr-only">
                        <Button
                            type="submit"
                            id={this.searchButtonID}
                            className={classNames(
                                "buttonPrimary",
                                "searchBar-submitButton",
                                this.props.buttonClassName,
                            )}
                        >
                            {this.props.isLoading ? <ButtonLoader /> : t("Search")}
                        </Button>
                    </ConditionalWrap>
                    <div className="searchBar-iconContainer">{search("searchBar-icon")}</div>
                </div>
            </form>
        );
    };

    private clear = (event: React.SyntheticEvent) => {
        event.preventDefault();
        this.props.onChange("");
        this.ref.current!.focus();
        this.props.onSearch();
    };

    /**
     * Handle the form submission.
     */
    private onFormSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        this.props.onSearch();
    };

    /**
     * @inheritDoc
     */
    public componentDidMount() {
        if (this.props.getRef) {
            this.props.getRef(this.ref);
        }
    }

    /*
    * Overwrite components in Select component
    */
    private componentOverwrites = {
        Control: this.SearchControl,
        IndicatorSeparator: selectOverrides.NullComponent,
        Menu: selectOverrides.Menu,
        MenuList: selectOverrides.MenuList,
        Option: this.props.optionComponent!,
        NoOptionsMessage: selectOverrides.NoOptionsMessage,
        ClearIndicator: selectOverrides.NullComponent,
        DropdownIndicator: selectOverrides.NullComponent,
        LoadingMessage: selectOverrides.OptionLoader,
    };
}