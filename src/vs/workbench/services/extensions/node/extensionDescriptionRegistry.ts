/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IExtensionDescription } from 'vs/workbench/services/extensions/common/extensions';
import { ExtensionIdentifier } from 'vs/platform/extensions/common/extensions';

export class ExtensionDescriptionRegistry {
	private _extensionDescriptions: IExtensionDescription[];
	private _extensionsMap: Map<string, IExtensionDescription>;
	private _extensionsArr: IExtensionDescription[];
	private _activationMap: Map<string, IExtensionDescription[]>;

	constructor(extensionDescriptions: IExtensionDescription[]) {
		this._extensionDescriptions = extensionDescriptions;
		this._initialize();
	}

	private _initialize(): void {
		this._extensionsMap = new Map<string, IExtensionDescription>();
		this._extensionsArr = [];
		this._activationMap = new Map<string, IExtensionDescription[]>();

		for (let i = 0, len = this._extensionDescriptions.length; i < len; i++) {
			let extensionDescription = this._extensionDescriptions[i];

			if (this._extensionsMap.has(ExtensionIdentifier.toKey(extensionDescription.identifier))) {
				// No overwriting allowed!
				console.error('Extension `' + extensionDescription.identifier.value + '` is already registered');
				continue;
			}

			this._extensionsMap.set(ExtensionIdentifier.toKey(extensionDescription.identifier), extensionDescription);
			this._extensionsArr.push(extensionDescription);

			if (Array.isArray(extensionDescription.activationEvents)) {
				for (let j = 0, lenJ = extensionDescription.activationEvents.length; j < lenJ; j++) {
					let activationEvent = extensionDescription.activationEvents[j];

					// TODO@joao: there's no easy way to contribute this
					if (activationEvent === 'onUri') {
						activationEvent = `onUri:${ExtensionIdentifier.toKey(extensionDescription.identifier)}`;
					}

					if (!this._activationMap.has(activationEvent)) {
						this._activationMap.set(activationEvent, []);
					}
					this._activationMap.get(activationEvent).push(extensionDescription);
				}
			}
		}
	}

	public keepOnly(extensionIds: ExtensionIdentifier[]): void {
		let toKeep = new Set<string>();
		extensionIds.forEach(extensionId => toKeep.add(ExtensionIdentifier.toKey(extensionId)));
		this._extensionDescriptions = this._extensionDescriptions.filter(extension => toKeep.has(ExtensionIdentifier.toKey(extension.identifier)));
		this._initialize();
	}

	public remove(extensionId: ExtensionIdentifier): void {
		this._extensionDescriptions = this._extensionDescriptions.filter(extension => !ExtensionIdentifier.equals(extension.identifier, extensionId));
		this._initialize();
	}

	public containsActivationEvent(activationEvent: string): boolean {
		return this._activationMap.has(activationEvent);
	}

	public getExtensionDescriptionsForActivationEvent(activationEvent: string): IExtensionDescription[] {
		if (!this._activationMap.has(activationEvent)) {
			return [];
		}
		return this._activationMap.get(activationEvent).slice(0);
	}

	public getAllExtensionDescriptions(): IExtensionDescription[] {
		return this._extensionsArr.slice(0);
	}

	public getExtensionDescription(extensionId: ExtensionIdentifier | string): IExtensionDescription | null {
		if (!this._extensionsMap.has(ExtensionIdentifier.toKey(extensionId))) {
			return null;
		}
		return this._extensionsMap.get(ExtensionIdentifier.toKey(extensionId));
	}
}
